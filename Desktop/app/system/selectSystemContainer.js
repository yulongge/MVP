/**
 * Created by Administrator on 2014/12/4.
 */
define(function (require, exports, module) {

    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");

    var layer = require("app/desktop/desktopLayer");
    var element = require("app/desktop/desktopElement");
    var application  = require("app/desktop/desktopApplication");
    var folderMax = require("app/desktop/desktopFolderMax");

    var selectSystem_tpl = require("selectSystem_tpl");

    /*
     * 复合应用视图
     * */
    var SelectSystemContainer = Backbone.View.extend({
        isFirstConfig: false,
        el: "div.desktop_selectsystem",
        templateSelectSystem: _.template(selectSystem_tpl),
        templateSystemList: _.template("<% for(var n in systems) { %> <li class='systemIcon' data-id='<%= systems[n].SystemID %>' data-url='<%= systems[n].HomePage %>' ><p><img title='<%= systems[n].SystemName %>' alt='<%= systems[n].SystemName %>' src='<%= systems[n].IconPath %>'></p><h5><%= systems[n].SystemName%></h5></li><% } %>"),
        events: {
            "click .window_con_list li": "chooseIconClick",
            "click .window_btn_wrap .start_but": "startUseClick",
            "click .maskDiv" : "allclick"
        },
        destroy: function () {
            this.stopListening();
            this.undelegateEvents();
            this.$el.empty();
        },
        /*
         * 桌面容器模型
         * */
        render: function () {
            this.$el.empty();
            this.$el.append(this.templateSelectSystem());

            config.AllSystems = _.reject(config.AllSystems,function(system){
                return system.SystemID == "fhyy" || system.SystemID == "MVP" ;
            });

            this.$el.find("ul.select_system_list").html(this.templateSystemList({"systems": config.AllSystems}));
            this.$el.find("ul.select_system_list img").error(function(){
                $(this).attr("src",config.AppDefaultIcon);
            });
            this.$el.find(".desktop_window").css({
                left:(util.postion.Param.Screen.Width-this.$el.find(".desktop_window").width())/2,
                top:(util.postion.Param.Screen.Height-this.$el.find(".desktop_window").height())/2
            });
            this.$el.show();


            var view = this;
            this.isFirstConfig =  $.parseJSON(config.IsConfigDefaultDesktop) == false;
            //非首次配置
            if(this.isFirstConfig == false){
                var exitSystemFolderId = util.findElementIdByAppId(config.DefautlFolderAppId);
                var systemFolderLayerId = util.getAppInWhichLayer(config.DefautlFolderAppId);
                var activeLayerId = util.getActiveLayerId();
                var activeApplicationAppIds = util.getLayerApplicationAppIds(activeLayerId);
                $.each(config.AllSystems,function(i,system){
                    if(exitSystemFolderId != config.NoFoundIdent && systemFolderLayerId == activeLayerId){
                        var folderElments =  $("#" + exitSystemFolderId).data("data").get("folderApps");
                        var folderApps = folderElments.where({appId: system.SystemID});
                        if(folderApps.length > 0){
                            view.$el.find("li[data-id='"+ system.SystemID+"']").append('<span class="sign"></span>');
                        }
                    }else{
                        if($.inArray(system.SystemID ,activeApplicationAppIds) >= 0){
                            view.$el.find("li[data-id='"+ system.SystemID+"']").append('<span class="sign"></span>');
                        }
                    }
                });
            }
        },
        allclick:function(event){
            event.stopPropagation();
            event.preventDefault();

        },
        chooseIconClick: function (event) {
            event.stopPropagation();
            var $element = $(event.currentTarget);
            if($element.find(".sign").length > 0){
                $element.find(".sign").remove();
            }else{
                var minicon = '<span class="sign"></span>';
                $element.append(minicon);
            }
        },
        startUseClick:function(event){
            event.stopPropagation();

            config.IsConfigDefaultDesktop = true;

            var systemIdList = [];

            this.$el.find("ul.select_system_list .sign").parent().each(function(i,e){
                systemIdList.push($(e).attr("data-id"));
            });

            if(systemIdList.length == 0 && this.isFirstConfig) {
                this.destroy();
                $(".desktop_selectsystem").hide();
                PubSub.publishSync(config.DesktopIsChangedEvent);
                return;
            }

            var desktopId = "L" + util.getNewId();
            if(this.isFirstConfig == false){
                desktopId = util.getActiveLayerId();
            }else{
                if(util.getLayersAppIds().length > 0){
                    var desktopLayer = new layer.DesktopLayer({
                        id: desktopId,
                        isActive: false
                    });
                    PubSub.publishSync(config.CreateLayerEvent,desktopLayer);
                    if(util.getAllLayers().length > 1){
                        PubSub.publishSync(config.SetLayerIndex, [desktopId,1]);
                    }
                    util.setActiveLayer(desktopId);
                }else{
                    desktopId = util.getActiveLayerId();
                }
            }

            //如果是编辑并且默认系统文件夹没在当前页
            if(this.isFirstConfig == false && util.getAppInWhichLayer(config.DefautlFolderAppId) != util.getActiveLayerId()){

                var activeApplicationAppIds = util.getLayerApplicationAppIds(desktopId);
                $.each(config.AllSystems,function(i,system){
                    //选中
                    if( $.inArray(system.SystemID,systemIdList) >= 0){
                        //桌面不存在
                        if($.inArray(system.SystemID,activeApplicationAppIds) < 0){
                            var appElementId =  "A" + util.getNewId();
                            var appElement = new application.DesktopApplication({
                                id:appElementId,
                                appId:system.SystemID,//appElementId,
                                name: system.SystemName,
                                appIconPath: system.IconPath == "" ? config.AppDefaultIcon: system.IconPath,
                                appCommand: "Aostar.MVP.WebBrowser.exe",
                                param: system.HomePage,
                                //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                                appType: config.ElementType.Application,
                                //0:BS 1:CS 2:独立，3内部启动
                                openType: 0,
                                systemId: system.SystemID,
                                position: {
                                    width: util.postion.Param.Element.Width,
                                    height: util.postion.Param.Element.Height
                                }
                            });
                            PubSub.publishSync([desktopId, config.CreateDesktopElementEvent].join("."), appElement);
                        }
                    }else{
                        //未选中，桌面有
                        if($.inArray(system.SystemID,activeApplicationAppIds) >= 0){
                            var layers = util.getLayers();
                            $.each(layers,function(i,layer){
                                $.each(layer.data,function(i,app){
                                    if(
                                        desktopId == layer.id
                                        && app.get("appType") == config.ElementType.Application
                                        && app.get("appId") == system.SystemID
                                    ){
                                        PubSub.publishSync([desktopId, config.RemoveDesktopElementEvent].join("."), app);
                                    }
                                });
                            });
                        }
                    }
                });

            }else{

                var exitFolderId = util.findElementIdByAppId(config.DefautlFolderAppId);
                var folderElments = new element.DesktopElements();
                if(exitFolderId == config.NoFoundIdent){
                    //创建文件夹
                    var width = 400;
                    var height = 300;
                    var position = {
                        top:  util.postion.Param.Screen.HeightPadding,
                        left: util.postion.Param.Screen.WidthPadding,
                        width: width,
                        height: height
                    };
                    var folder = new folderMax.DesktopFolderMax();
                    var folderId = "F" + util.getNewId();
                    folder.set({
                        id: folderId,
                        appId: config.DefautlFolderAppId,
                        name: "业务系统",
                        appType: config.ElementType.Folder,
                        position: position,
                        folderType: config.FolderType_MAX,
                        folderLayout: config.FolderLayout_Grid,
                        folderApps: folderElments
                    });
                    exitFolderId = folderId;
                    //创建文件夹
                    PubSub.publishSync([desktopId, config.CreateDesktopFloatEvent].join("."), folder);
                }else{
                    var exitFolder = $("#"+exitFolderId).data("data");
                    folderElments = exitFolder.get("folderApps");
                }

                $.each(config.AllSystems,function(i,system){
                    //选中
                    if( $.inArray(system.SystemID,systemIdList) >= 0){
                        //文件夹里没有
                        if(folderElments.where({appId: system.SystemID}).length == 0){
                            var appElementId =  "A" + util.getNewId();
                            var appElement = new application.DesktopApplication({
                                id:appElementId,
                                appId:system.SystemID,//appElementId,
                                name: system.SystemName,
                                appIconPath: system.IconPath == "" ? config.AppDefaultIcon: system.IconPath,
                                appCommand: "Aostar.MVP.WebBrowser.exe",
                                param: system.HomePage,
                                //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                                appType: config.ElementType.Application,
                                //0:BS 1:CS 2:独立，3内部启动
                                openType: 0,
                                systemId: system.SystemID,
                                position: {
                                    width: util.postion.Param.Element.Width,
                                    height: util.postion.Param.Element.Height
                                }
                            });
                            folderElments.add(appElement);
                        }
                    }else{
                        //未选中，文件夹里有
                        var folderApps = folderElments.where({appId: system.SystemID});
                        if(folderApps.length > 0){
                            $.each(folderApps,function(i,folderApp){
                                PubSub.publishSync([desktopId,exitFolderId,config.RemoveFolderAppEvent].join("."),folderApp);
                            });
                        }
                    }
                });
            }

            this.destroy();
            $(".desktop_selectsystem").hide();
            PubSub.publishSync(config.DesktopIsChangedEvent);
        }
    });

    module.exports = {
        SelectSystemContainer: SelectSystemContainer
    };
});