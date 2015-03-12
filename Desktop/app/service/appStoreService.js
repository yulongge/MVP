/**
 * Created by 盖玉龙 on 2014/9/29.
 */
define(function(require, exports, module){
    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var json2 = require("json2");
    var config = require("app/config");

    var appStoreContainer = require("app/store/appStoreContainer");
    var appStoreSystem = require("app/store/appStoreSystem");
    var appStoreType= require("app/store/appStoreType");
    var appStoreList = require("app/store/appStoreList");
    
    var MvpService = require("mvpService");

    var AppStoreService = {};
    
    AppStoreService.resgistCommand = function(){
        //打开应用中心
        PubSub.unsubscribe(config.OpenAppStoreEvent);
        PubSub.subscribe(config.OpenAppStoreEvent,function(message,data){
            AppStoreService.createAppStore();
        });
    };

    /*
    * 创建应用中心
    * */
    AppStoreService.createAppStore = function(){
        var appStoreContainerView = new appStoreContainer.AppStoreContainerView();
        appStoreContainerView.render();

        AppStoreService.initAppStoreSystem();
        AppStoreService.initAppStoreType();
        AppStoreService.initAppStoreList();


        //获取所有业务域回调
        PubSub.unsubscribe(config.GetFieldsCallBack);
        PubSub.subscribe(config.GetFieldsCallBack,function(message,data){
            AppStoreService.addAppStoreField(data);
        });

        //获取所有业务域
        PubSub.unsubscribe(config.GetFields);
        PubSub.subscribe(config.GetFields,function(message,data){
            PubSub.publishSync(config.ResetStoreFieldsEvent);

            MvpService.call(config.GetFields,[data]);
        });

        //获取所有业务域回调
        PubSub.unsubscribe(config.GetSystemsByFieldIdCallBack);
        PubSub.subscribe(config.GetSystemsByFieldIdCallBack,function(message,data){
            AppStoreService.addAppStoreSystem(data);
        });

        //获取指定业务域中所有系统
        PubSub.unsubscribe(config.GetSystemsByFieldId);
        PubSub.subscribe(config.GetSystemsByFieldId,function(message,data){
            PubSub.publishSync(config.ResetStoreSystemsEvent);

            MvpService.call(config.GetSystemsByFieldId,[data]);
        });


        //获取应用类型
        PubSub.unsubscribe(config.GetStoreTypeCallBack);
        PubSub.subscribe(config.GetStoreTypeCallBack,function(message,data){
            //选准备订阅事件，等待查询结果
            AppStoreService.addAndRenderType(data);
        });

        //获取应用类型
        PubSub.unsubscribe(config.GetStoreType);
        PubSub.subscribe(config.GetStoreType,function(message,data){
            PubSub.publishSync(config.ResetStoreTypesEvent);
            PubSub.publishSync(config.RestStorePagingEvent);

            var types = config.StoreElementType;
            PubSub.publishSync(config.GetStoreTypeCallBack,types);
        });

        //获取指定业务域下所有应用，带分页回调
        PubSub.unsubscribe(config.GetAppsByFieldIdCallBack);
        PubSub.subscribe(config.GetAppsByFieldIdCallBack,function(message,data){

            //var key = data[0];
            AppStoreService.addAndRenderListApp(data[1]);
            PubSub.publishSync(config.AppStoreNeedMoreEvent,data[1]);
        });


        //获取指定业务域下所有应用，带分页
        PubSub.unsubscribe(config.GetAppsByFieldId);
        PubSub.subscribe(config.GetAppsByFieldId,function(message,data){
            var key = "GetAppsByFieldId -- FieldId:" + config.PageHelper.FieldId +
                ",AppType:" + config.PageHelper.AppType +
                ",PageIndex:" + config.PageHelper.PageIndex +
                ",PageSize:" + config.PageHelper.PageSize;
            seajs.log(key);

            if(config.PageHelper.AppType == config.ElementType.Composite){
                MvpService.call(config.GetAppsByFieldId,
                    ["fhyy",
                        config.PageHelper.AppType,
                        config.PageHelper.PageIndex,
                        config.PageHelper.PageSize,
                        key]);
            }else{
                MvpService.call(config.GetAppsByFieldId,
                    [config.PageHelper.FieldId,
                        config.PageHelper.AppType,
                        config.PageHelper.PageIndex,
                        config.PageHelper.PageSize,
                        key]);
            }
        });


        //获取指定业务域下所有应用，带分页回调
        PubSub.unsubscribe(config.GetAppsBySystemIdCallBack);
        PubSub.subscribe(config.GetAppsBySystemIdCallBack,function(message,data){

            //var key = data[0];
            AppStoreService.addAndRenderListApp(data[1]);
            PubSub.publishSync(config.AppStoreNeedMoreEvent,data[1]);
        });



        //获取指定业务域下所有应用，带分页
        PubSub.unsubscribe(config.GetAppsBySystemId);
        PubSub.subscribe(config.GetAppsBySystemId,function(message,data){
            var key = "GetAppsBySystemId -- SystemId:" + config.PageHelper.SystemId +
                ",AppType:" + config.PageHelper.AppType +
                ",PageIndex:" + config.PageHelper.PageIndex +
                ",PageSize:" + config.PageHelper.PageSize;
            seajs.log(key);

            if(config.PageHelper.AppType == config.ElementType.Composite){
                MvpService.call(config.GetAppsBySystemId,
                    ["fhyy",
                        config.PageHelper.AppType,
                        config.PageHelper.PageIndex,
                        config.PageHelper.PageSize,
                        key]);
            }else {
                MvpService.call(config.GetAppsBySystemId,
                    [config.PageHelper.SystemId,
                        config.PageHelper.AppType,
                        config.PageHelper.PageIndex,
                        config.PageHelper.PageSize,
                        key]);
            }
        });

        //查询应用，不带分页回调
        PubSub.unsubscribe(config.SearchAppsByKeyCallBack);
        PubSub.subscribe(config.SearchAppsByKeyCallBack,function(message,data){
            //var key = data[0];
            AppStoreService.addAndRenderSearchApp(data[1]);
            PubSub.publishSync(config.AppStoreNeedMoreEvent,data[1]);
        });

        //查询应用
        PubSub.unsubscribe(config.SearchAppsByKey);
        PubSub.subscribe(config.SearchAppsByKey,function(message,data){
            var key = "SearchAppsByKey -- SearchKey:" + config.PageHelper.SearchKey +
                ",AppType:" + config.PageHelper.AppType +
                ",PageIndex:" + config.PageHelper.PageIndex +
                ",PageSize:" + config.PageHelper.PageSize;
            seajs.log(key);
            MvpService.call(config.SearchAppsByKey,
                [config.PageHelper.SearchKey,
                    "",
                    config.PageHelper.AppType,
                    -1,
                    config.PageHelper.PageSize,
                    key]);
        });

        //应用中心翻页逻辑
        PubSub.unsubscribe(config.AppStorePageEvent);
        PubSub.subscribe(config.AppStorePageEvent,function(message,data){
            if(config.PageHelper.Type == "Search"){
                PubSub.publishSync(config.SearchAppsByKey,config.PageHelper);
                config.PageHelper.PageIndex ++;
            }else if(config.PageHelper.Type == "ListField"){
                PubSub.publishSync(config.GetAppsByFieldId,config.PageHelper);
                config.PageHelper.PageIndex ++;
            }else if(config.PageHelper.Type == "ListSystem"){
                PubSub.publishSync(config.GetAppsBySystemId,config.PageHelper);
                config.PageHelper.PageIndex ++;
            }
        });

        PubSub.publish(config.GetFields);
    };

    /*
    * 渲染应用中心系统菜单
    * */
    AppStoreService.initAppStoreSystem = function(){
        var appStoreFields = new appStoreSystem.AppStoreFields();
        var appStoreSystems = new appStoreSystem.AppStoreSystems();
        var appStoreSystemView = new appStoreSystem.AppStoreSystemsView({el:".desktop_store ul.widnow_menu_list"});

        appStoreSystemView.setModel(appStoreFields,appStoreSystems);


        PubSub.unsubscribe(config.ResetStoreSystemsEvent);
        PubSub.subscribe(config.ResetStoreSystemsEvent,function(message,data){
            appStoreSystems.reset();
        });


        PubSub.unsubscribe(config.ResetStoreFieldsEvent);
        PubSub.subscribe(config.ResetStoreFieldsEvent,function(message,data){
            appStoreFields.reset();
        });

        PubSub.unsubscribe(config.StoreSystemAddEvent);
        PubSub.subscribe(config.StoreSystemAddEvent,function(mesaage,data){
            if($.isArray(data) && data.length>0 && $.isArray(data[0]) && data[0].length>0){
                _.each(data[0],function(v,i){
                    var system = new appStoreSystem.AppStoreSystem({
                        id:"S" + util.getNewId(),
                        systemId:v.SystemID,
                        systemName:v.SystemName,
                        num: v.num
                    });
                    appStoreSystems.add(system);
                });
            }
        });


        PubSub.unsubscribe(config.StoreFieldAddEvent);
        PubSub.subscribe(config.StoreFieldAddEvent,function(mesaage,data){
            if($.isArray(data) && data.length>0 && $.isArray(data[0]) && data[0].length>0){
                _.each(data[0],function(v,i){
                    if(v.FieldID != "fhyy"){
                        var field = new appStoreSystem.AppStoreField({
                            id:"F" + util.getNewId(),
                            fieldId:v.FieldID,
                            fieldName:v.FieldName,
                            num: v.num
                        });
                        field.isActive = i == 0;
                        appStoreFields.add(field);
                    }
                });
            }
        });

    };

    AppStoreService.addAppStoreSystem = function(data){
        PubSub.publish(config.StoreSystemAddEvent,data);
    };


    AppStoreService.addAppStoreField = function(data){
        PubSub.publish(config.StoreFieldAddEvent,data);
    };

    /*
    * 初始化应用中心功能菜单
    * */
    AppStoreService.initAppStoreType = function(){
        var appStoreTypes = new appStoreType.AppStoreTypes();
        var appStoreTypesView = new appStoreType.AppStoreTypesView({el:".desktop_store ul.window_tab_menu"});
        appStoreTypesView.setModel(appStoreTypes);

        PubSub.unsubscribe(config.ResetStoreTypesEvent);
        PubSub.subscribe(config.ResetStoreTypesEvent,function(message,data){
            appStoreTypes.reset();
        });

        PubSub.unsubscribe(config.StoreTypeAddEvent);
        PubSub.subscribe(config.StoreTypeAddEvent,function(mesaage,data){
            if($.isArray(data) && data.length>0){
                _.each(data,function(v){
                    appStoreTypes.add(new appStoreType.AppStoreType({
                        id:"T" + util.getNewId(),
                        typeId: v.id,
                        typeName: v.name,
                        typeNum: v.typenum,
                        isSelected: v.isSelected
                    }));
                });
            }
        });

    };

    /*
    * 添加渲染类型
    * */
    AppStoreService.addAndRenderType = function(data){
        PubSub.publish(config.StoreTypeAddEvent,data);
    };

    /*
    * 初始化应用中应用元素
    * */
    AppStoreService.initAppStoreList = function(){
        var appStoreLists = new appStoreList.AppStoreLists();
        var appStoreGroups = new appStoreList.AppStoreGroups();

       /* var appStoreListView = new appStoreList.AppStoreListView({el:".desktop_store .window_con_height"});
        appStoreListView.setModel(appStoreLists,appStoreGroups);*/

        var appStoreListView = null;
        if(util.postion.Param.IsAppStoreGuid){
            appStoreListView = new appStoreList.AppStoreListView({el:".desktop_store .window_right .window_apply_left .window_apply_high"});
            appStoreListView.setModel(appStoreLists,appStoreGroups);
        }else{
            appStoreListView = new appStoreList.AppStoreListView({el:".desktop_store .window_con_height"});
            appStoreListView.setModel(appStoreLists,appStoreGroups);
        }

        //列表重置
        PubSub.unsubscribe(config.RestStorePagingEvent);
        PubSub.subscribe(config.RestStorePagingEvent,function(message,data){
            appStoreLists.reset();
        });

        //列表添加应用
        PubSub.unsubscribe(config.StorePagingAddAppEvent);
        PubSub.subscribe(config.StorePagingAddAppEvent,function(mesaage,data){
            appStoreListView.showList();

            if($.isArray(data) && data.length>0 && $.isArray(data[0]) && data[0].length>0){
                _.each(data[0],function(v){
                    if(v.DelFlag == 0){
                        appStoreLists.add(new appStoreList.AppStoreList({
                            id: "A" + util.getNewId(),
                            appId:v.AppID,
                            appName:v.Name,
                            iconPath:v.IconPath,
                            openType: v.OpenType,
                            systemId: v.SystemID,
                            appType: v.AppType,
                            appIconPath:v.AppIconPath,
                            appCommand: v.AppCommand,
                            loginType: v.LoginType,
                            isAccess: v.IsAccess == undefined ? true: v.IsAccess,
                            param: v.param,
                            //index: v.Index,
                            //isLastUse: v.IsLastUse,
                            //isCommonUse: v.IsCommonUse,
                            delFlag:v.DelFlag,
                            url: v.url == undefined?"": v.url
                        }));
                    }
                });
            }
        });

        //搜索重置
        PubSub.unsubscribe(config.RestStoreSearchEvent);
        PubSub.subscribe(config.RestStoreSearchEvent,function(message,data){
            appStoreGroups.reset();
        });

        //搜索添加结果
        PubSub.unsubscribe(config.StoreSearchAddAppEvent);
        PubSub.subscribe(config.StoreSearchAddAppEvent,function(mesaage,data){
            var count = 0;
            if($.isArray(data) && data.length>0 && $.isArray(data[0]) && data[0].length>0){
                count = data[0].length;
            }
            appStoreListView.showSearch(count);

            if($.isArray(data) && data.length>0 && $.isArray(data[0]) && data[0].length>0){
                var groupElements = _.groupBy(data[0], function(elment) {
                    return elment.SystemID;
                });

                $.each(groupElements,function(index,group){
                    var name = index;
                    var systems = _.where(config.AllSystems,{"SystemID":index});
                    if(systems && systems.length > 0){
                        name = systems[0].SystemName;
                    }

                    var appList = new appStoreList.AppStoreLists();

                    _.each(group,function(v){
                        if(v.DelFlag == 0){
                            appList.add(new appStoreList.AppStoreList({
                                id: "A" + util.getNewId(),
                                appId:v.AppID,
                                appName:v.Name,
                                iconPath:v.IconPath,
                                openType: v.OpenType,
                                systemId: v.SystemID,
                                appType: v.AppType,
                                appIconPath:v.AppIconPath,
                                appCommand: v.AppCommand,
                                loginType: v.LoginType,
                                isAccess: v.IsAccess == undefined ? true: v.IsAccess,
                                param: v.param,
                                //index: v.Index,
                                //isLastUse: v.IsLastUse,
                                //isCommonUse: v.IsCommonUse,
                                delFlag:v.DelFlag
                            }));
                        }
                    });

                    var systemGroup = new appStoreList.AppStoreGroup({
                        id: "G" + util.getNewId(),
                        systemId: index,
                        systemName: name,
                        appList: appList,
                        count:group.length
                    });

                    appStoreGroups.add(systemGroup);
                });
            }
        });


    };

    /*
    * 添加渲染应用
    * */
    AppStoreService.addAndRenderListApp = function(data){
        PubSub.publish(config.StorePagingAddAppEvent,data);
    };

    /*
     * 添加渲染应用
     * */
    AppStoreService.addAndRenderSearchApp = function(data){
        PubSub.publish(config.StoreSearchAddAppEvent,data);
    };


    //初始化
    exports.init = function(){
        AppStoreService.resgistCommand();
    };
});