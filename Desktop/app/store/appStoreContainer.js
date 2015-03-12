/**
 * Created by 盖玉龙 on 2014/10/13. 应用中心
 */
define(function(require, exports, module) {

    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");
    var json2 = require("json2");

    var appStoreContainer_tpl = require("appStoreContainer_tpl");
    var appStoreContainerGuid_tpl = require("appStoreContainerGuid_tpl");
    var application  = require("app/desktop/desktopApplication");

    var AppStoreContainerView = Backbone.View.extend({
        el: "div.desktop_store",
        events:{
            "click": "storeClick",
            "click .oper3" :"closeView",
            "click .oper2" :"switchSize",
            "click .window_con_view span a" :"showCardOrList",
            "click .window_blue":"completeConfig",
            "click .window_left div":"tip1Hide"
        },
        tempalte: _.template(appStoreContainer_tpl),
        tempalte_guid: _.template(appStoreContainerGuid_tpl),
        render:function(){
            this.isMax = false;
            if(util.postion.Param.IsAppStoreGuid){
                this.makeGuidView();
            }else{
                this.makeView();
            }

            this.appStoreDrag();
            this.appStoreResize();
            this.appStoreSearch();
            this.bindScrollPage();
            this.addMorePageButton();
            this.showStoreAndResize();

            var view = this;
            //复合应用销毁逻辑
            PubSub.unsubscribe(config.DestroyStoreContainerEvent);
            PubSub.subscribe(config.DestroyStoreContainerEvent,function(message,data){
                view.destroy();
            });

        },
        destroy: function() {
            this.stopListening();
            this.undelegateEvents();
            this.$el.empty();
        },
        storeClick:function(event){
            event.stopPropagation();
        },
        tip1Hide:function(){
            $(".guid_tip1").hide();
            $(".guid_tip2").show();
        },
        completeConfig:function(){
            $(".guid_tip3").hide();
            var appElements = this.$el.find(".window_apply_right .window_apply_con li");
            appElements.each(function(i){
                var appElementFromStore =  $(this).data("data");
                var appElementConvert = new application.DesktopApplication({
                    id: "A" + util.getNewId(),//appElementFromStore.get("id"),
                    name: appElementFromStore.get("appName"),
                    appId: appElementFromStore.get("appId"),
                    sysIconPath: appElementFromStore.get("iconPath"),
                    appIconPath: appElementFromStore.get("appIconPath"),
                    appCommand: appElementFromStore.get("appCommand"),
                    param: appElementFromStore.get("param"),
                    //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                    appType: appElementFromStore.get("appType"),
                    //0:BS 1:CS 2:独立，3内部启动
                    openType: appElementFromStore.get("openType"),
                    systemId: appElementFromStore.get("systemId"),
                    position: {
                        width: util.postion.Param.Element.Width,
                        height: util.postion.Param.Element.Height
                    }
                });
                PubSub.publishSync([util.getActiveLayerId(), config.CreateDesktopElementEvent].join("."), appElementConvert);
            });
            PubSub.publishSync(config.HideDesktopPopThings);
        },
        makeGuidView:function(){
            this.$el.empty();
            this.$el.append(this.tempalte_guid());
            this.$el.find(".widnow_search_bg").
                append("<a href=\"javascript:void(0)\" class=\"search_del\" style=\"display:none;\"></a>");

            this.showCardOrList(this.$el.find(".window_con_view").find("span").find("a").last());

            var width = util.postion.Param.CompositeAppSize.Width;
            var height = util.postion.Param.CompositeAppSize.Height;
            this.$el.find(".window_apply_left .window_apply_con").height(height - 92 - 47);
            this.$el.find(".window_apply_right .window_apply_con").height(height - 92 - 47);
        },
        makeView:function(){
            this.$el.empty();
            this.$el.append(this.tempalte());
            this.$el.find(".widnow_search_bg").
                append("<a href=\"javascript:void(0)\" class=\"search_del\" style=\"display:none;\"></a>");

            this.showCardOrList(this.$el.find(".window_con_view").find("span").find("a").last());
        },
        showStoreAndResize:function(){
            var width = 0;
            var height = 0;
            if(util.postion.Param.IsAppStoreGuid){
                width = util.postion.Param.CompositeAppSize.Width;
                height = util.postion.Param.CompositeAppSize.Height;
            }else{
                width = util.postion.Param.AppStoreSize.Width;
                height = util.postion.Param.AppStoreSize.Height;
            }
            this.$el.find(".desktop_window").css({
                left:(util.postion.Param.Screen.Width-width)/2,
                top:(util.postion.Param.Screen.Height-height)/2
            }).width(width).height(height);

            this.$el.find(".window_right").height(height - util.postion.Param.AppStoreSize.TitleHeight);
            this.$el.find(".window_con_height").height(height - 100- util.postion.Param.AppStoreSize.TitleHeight);
            this.$el.show();
            this.$el.find(".desktop_window").hide().effect("fade","slow").show();
        },
        closeView:function(){
            $(".desktop_mask_layer").hide();
            this.close();
        },
        appStoreSearch:function(){
            var _this = this;
            config.SearchInterval = null;
            var searchKey = "";
            _this.$el.find(".search_input input").keyup(function(){
                var input = this;
                if(searchKey == $(input).val()) return;

                if(config.SearchInterval)
                    clearTimeout(config.SearchInterval);
                config.SearchInterval = setTimeout(function(){
                    if ($(input).val() != "") {
                        _this.$el.find(".search_icon").hide();
                        _this.$el.find(".search_del").show();
                        config.PageHelper.Type = "Search";
                        PubSub.publishSync(config.RestStoreSearchEvent);
                    } else {
                        _this.$el.find(".search_del").hide();
                        _this.$el.find(".search_icon").show();

                        if(config.PageHelper.FieldId != ""){
                            config.PageHelper.Type = "ListField";
                        }
                        if(config.PageHelper.SystemId != ""){
                            config.PageHelper.Type = "ListSystem";
                        }
                        PubSub.publishSync(config.RestStorePagingEvent);
                    }

                    _this.$el.find(".window_con_height").scrollTop(0);

                    config.PageHelper.PageIndex = 1;
                    config.PageHelper.SearchKey = util.inputCheck($(input).val());
                    PubSub.publishSync(config.AppStorePageEvent);

                    searchKey = $(input).val();
                    config.SearchInterval = null;

                },300);

            }).change(function(){
                searchKey =  $(this).val();
            }).val("sss");



            _this.$el.find(".search_del").click(function(){
                _this.$el.find(".search_input input").val("").trigger("change");
                _this.$el.find(".search_del").hide();
                _this.$el.find(".search_icon").show();

                _this.$el.find(".window_con_height").scrollTop(0);

                if(config.PageHelper.FieldId != ""){
                    config.PageHelper.Type = "ListField";
                }
                if(config.PageHelper.SystemId != ""){
                    config.PageHelper.Type = "ListSystem";
                }

                config.PageHelper.PageIndex = 1;
                config.PageHelper.SearchKey = "";
                PubSub.publishSync(config.RestStorePagingEvent);
                PubSub.publishSync(config.AppStorePageEvent);
            });
        },
        appStoreDrag:function(){
            this.$el.find(".desktop_window").draggable({
                handle:".window_header",
				stop:function(event,ui){
					 var pos = {
                        top : ui.position.top,
                        left : ui.position.left,
                        width : ui.helper.width(),
                        height : ui.helper.height()
                    };
					 var toPos =  util.postion.checkBoundary(pos,{top:util.postion.Param.Folder.MarginTop,bottom:util.postion.Param.Folder.MarginBottom});
                    ui.helper.animate(toPos);	
				}
            });
        },
        appStoreResize:function(){
            var _this = this;
            _this.$el.find(".desktop_window").resizable({
                minWidth: util.postion.Param.AppStoreSize.Width,
                minHeight: util.postion.Param.AppStoreSize.Height,
                resize:function(event,ui){
                    var height = ui.size.height;
                    _this.$el.find(".window_right").height(height - util.postion.Param.AppStoreSize.TitleHeight);
                    _this.$el.find(".window_con_height").height(height - 100- util.postion.Param.AppStoreSize.TitleHeight);
                }
            });
        },
        close:function(){
            this.$el.hide();
        },
        switchSize:function(){
            if(this.isMax){
                this.minSize();
                this.isMax = false;
                this.$el.find(".desktop_window").draggable("enable");
            }else{
                this.maxSize();
                this.isMax = true;
                this.$el.find(".desktop_window").draggable("disable");
            }
        },
        maxSize:function(){
            var sWidth = util.postion.Param.Screen.Width;//桌面宽度
            var sHeight = util.postion.Param.Screen.Height-30;//桌面高度
            this.$el.css({left:"0px",top:"0px"});
            this.$el.find(".desktop_window").css({left:"0px",top:"30px",width:sWidth+"px",height:sHeight+"px"});
            this.$el.find(".oper2").addClass("oper2_restore");
            this.$el.find(".window_right").height(sHeight - util.postion.Param.AppStoreSize.TitleHeight);
            this.$el.find(".window_con_height").height(sHeight - 100- util.postion.Param.AppStoreSize.TitleHeight-50);
            this.$el.find(".oper2").attr("title","向下还原");
            PubSub.publishSync(config.AppStoreNeedMoreEvent);
        },
        minSize:function(){
            this.$el.find(".desktop_window").css({
                left:(util.postion.Param.Screen.Width-util.postion.Param.AppStoreSize.Width)/2,
                top:(util.postion.Param.Screen.Height-util.postion.Param.AppStoreSize.Height)/2
            }).width(util.postion.Param.AppStoreSize.Width).height(util.postion.Param.AppStoreSize.Height);

            this.$el.find(".window_right").height(util.postion.Param.AppStoreSize.Height -  util.postion.Param.AppStoreSize.TitleHeight);
            this.$el.find(".window_con_height").height(util.postion.Param.AppStoreSize.Height - 100 - util.postion.Param.AppStoreSize.TitleHeight);
            this.$el.find(".oper2").attr("title","最大化");
            this.$el.find(".oper2").removeClass("oper2_restore");
            PubSub.publishSync(config.AppStoreNeedMoreEvent);
        },
        showCardOrList:function(event){
            var $element = $(event.currentTarget);
            if($element.hasClass("view_list")){
                $element.parent().removeClass("view2");
                $element.parent().addClass("view1");
                this.$el.find(".window_con_height .window_view_info").removeClass("window_view_card");
                this.$el.find(".window_con_height .window_view_info").addClass("window_view_list");
            }else{
                $element.parent().removeClass("view1");
                $element.parent().addClass("view2");
                this.$el.find(".window_con_height .window_view_info").removeClass("window_view_list");
                this.$el.find(".window_con_height .window_view_info").addClass("window_view_card");
            }
        },
        bindScrollPage:function(){
            this.$el.find(".window_con_height").scroll(function () {
                if(config.PageHelper.Type == "Search")return;
                var $scrollElement = $(this);
                var scrollElement = $scrollElement[0];
                if (scrollElement.scrollTop != 0 && (scrollElement.scrollHeight - scrollElement.scrollTop - $scrollElement.height()) <= 0) {
                    PubSub.publishSync(config.AppStorePageEvent);
                }
            });
        },
        addMorePageButton:function(){
            var _this = this;
            PubSub.subscribe(config.AppStoreNeedMoreEvent,function(message,data){

                var $operateObj = _this.$el.find(".window_con_height");
                if(config.PageHelper.Type == "Search"){
                    if($operateObj.find(".loadmore").length>0){
                        $operateObj.find(".loadmore").remove();
                    }
                    return;
                }
                if($operateObj.scrollTop()>0){
                    var loadmoreStr = "<div class=\"loadmore\" style=\"position:absolute;width:66%;height:30px;background:#fff;cursor:pointer;bottom:1px;line-height:30px;text-align:center;\"><div style=\"width:150px;margin:0 auto;height:100%;background: #BDBABA;\">加载更多</div></div>";
                    var $loadmore = $(loadmoreStr);
					$operateObj.find(".loadmore").remove();
                    $operateObj.append($loadmore);
                    $loadmore.click(function(){
                        PubSub.publishSync(config.AppStorePageEvent);
						$operateObj.scrollTop($operateObj.scrollTop()+300); 
                    });
                }else{
                    if($operateObj.find(".loadmore").length>0){
                        $operateObj.find(".loadmore").remove();
                    }
                }
                if(data[0].length<=0){
                    if($operateObj.find(".loadmore").length>0){
                        $operateObj.find(".loadmore").remove();
                    }
                }
            });
        }

    });

    module.exports = {
        AppStoreContainerView: AppStoreContainerView
    };
});