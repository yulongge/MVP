/**
 * Created by Administrator on 2014/10/25.
 */
define(function (require, exports, module) {
    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var json2 = require("json2");

    var config = require("app/config");

    var composite = require("app/desktop/desktopComposite");
    var compositeContainer = require("app/composite/compositeAppContainer");

    var appStoreSystem = require("app/store/appStoreSystem");
    var appStoreList = require("app/store/appStoreList");

    var MvpService = require("mvpService");

    var CompositeAppService = {};


    CompositeAppService.resgistCommand = function () {

        //打开复合应用
        PubSub.unsubscribe(config.OpenCompositeEvent);
        PubSub.subscribe(config.OpenCompositeEvent, function (message, data) {
            var desktopComposite = new composite.DesktopComposite();
            desktopComposite.isNewModel = true;
            CompositeAppService.createCompositeApp(desktopComposite);
        });


        //编辑复合应用
        PubSub.unsubscribe(config.OpenEditCompositeEvent);
        PubSub.subscribe(config.OpenEditCompositeEvent, function (message, data) {
            data.isNewModel = false;
            CompositeAppService.createCompositeApp(data);
        });

    };


    /*
    * 渲染复合应用 ---龙
    * */
    CompositeAppService.createCompositeApp = function (data) {
        var desktopComposite = data;
        var compositeAppContainer = new compositeContainer.CompositeAppContainer();

        var appStoreFields = new appStoreSystem.AppStoreFields();
        var appStoreLists = new appStoreList.AppStoreLists();

        compositeAppContainer.setModel(desktopComposite, appStoreFields, appStoreLists);

        //获取所有业务域回调
        PubSub.unsubscribe(config.GetFieldsCallBack);
        PubSub.subscribe(config.GetFieldsCallBack, function (message, data) {
            if ($.isArray(data) && data.length > 0 && $.isArray(data[0]) && data[0].length > 0) {
                _.each(data[0], function (v, i) {
                    if (v.FieldID != "fhyy") {
                        var model = new appStoreSystem.AppStoreField({
                            id: "S" + util.getNewId(),
                            fieldId: v.FieldID,
                            fieldName: v.FieldName,
                            num: v.num
                        });
                        model.isActive = i == 0;
                        appStoreFields.add(model);
                    }
                });
            }
        });

        //获取所有业务域
        PubSub.unsubscribe(config.GetFields);
        PubSub.subscribe(config.GetFields, function (message, data) {
            MvpService.call(config.GetFields, [data]);
        });


        //获取指定业务域下所有应用，带分页回调
        PubSub.unsubscribe(config.GetAppsByFieldIdCallBack);
        PubSub.subscribe(config.GetAppsByFieldIdCallBack, function (message, data) {
            //var key = data[0];
            var appData = data[1];
            if ($.isArray(appData) && appData.length > 0 && $.isArray(appData[0]) && appData[0].length > 0) {
                _.each(appData[0], function (app) {
                    if (app.DelFlag == 0) {
                        appStoreLists.add(new appStoreList.AppStoreList({
                            id: "C" + util.getNewId(),
                            appId: app.AppID,
                            appName: app.Name,
                            iconPath: app.IconPath,
                            appCommand: app.AppCommand,
                            param: app.param,
                            openType: app.OpenType,
                            systemId: app.SystemID,
                            appType: app.AppType,
                            appIconPath: app.AppIconPath,
                            //index: data.Index,
                            //isLastUse: data.IsLastUse,
                            //isCommonUse: data.IsCommonUse,
                            delFlag: app.DelFlag
                        }));
                    }
                });
            }
        });


        //获取指定业务域下所有应用，带分页
        PubSub.unsubscribe(config.GetAppsByFieldId);
        PubSub.subscribe(config.GetAppsByFieldId, function (message, data) {
            var key = "GetAppsByFieldId -- FieldId:" + config.PageHelper.FieldId +
                ",AppType:" + config.PageHelper.AppType +
                ",PageIndex:" + config.PageHelper.PageIndex +
                ",PageSize:" + config.PageHelper.PageSize;
            seajs.log(key);
            MvpService.call(config.GetAppsByFieldId,
                [config.PageHelper.FieldId,
                    0,
                    config.PageHelper.PageIndex,
                    config.PageHelper.PageSize,
                    key]);
        });

        //查询应用，带分页回调
        PubSub.unsubscribe(config.SearchAppsByKeyCallBack);
        PubSub.subscribe(config.SearchAppsByKeyCallBack, function (message, data) {
            //var key = data[0];
            config.PageHelper.Count = 0;
            var appData = data[1];
            if ($.isArray(appData) && appData.length > 0 && $.isArray(appData[0]) && appData[0].length > 0) {
                _.each(appData[0], function (app) {
                    if (app.DelFlag == 0) {
                        appStoreLists.add(new appStoreList.AppStoreList({
                            id: "A" + util.getNewId(),
                            appId: app.AppID,
                            appName: app.Name,
                            iconPath: app.IconPath,
                            appCommand: app.AppCommand,
                            param: app.param,
                            openType: app.OpenType,
                            systemId: app.SystemID,
                            appType: app.AppType,
                            appIconPath: app.AppIconPath,
                            //index: data.Index,
                            //isLastUse: data.IsLastUse,
                            //isCommonUse: data.IsCommonUse,
                            delFlag: app.DelFlag
                        }));
                    }
                });
                if ($.isArray(appData) && appData.length > 1 && $.isArray(appData[1]) && appData[1].length > 0){
                    var count = appData[1][0].num;
                    compositeAppContainer.showSearch(count);
                }
            }
            CompositeAppService.addAndRenderSearchApp(appData);
        });

        //查询应用
        PubSub.unsubscribe(config.SearchAppsByKey);
        PubSub.subscribe(config.SearchAppsByKey, function (message, data) {
            var key = "SearchAppsByKey -- SearchKey:" + config.PageHelper.SearchKey +
                ",FieldId:" + config.PageHelper.FieldId +
                ",AppType:" + config.ElementType.Application +
                ",PageIndex:" + config.PageHelper.PageIndex +
                ",PageSize:" + config.PageHelper.PageSize;
            seajs.log(key);
            MvpService.call(config.SearchAppsByKey,
                [config.PageHelper.SearchKey,
                    config.PageHelper.FieldId,
                    config.ElementType.Application,
                    config.PageHelper.PageIndex,
                    config.PageHelper.PageSize,
                    key]);
        });

        //搜索添加结果
        PubSub.unsubscribe(config.ComSearchAddAppEvent);
        PubSub.subscribe(config.ComSearchAddAppEvent, function (mesaage, data) {

            if ($.isArray(data) && data.length > 0 && $.isArray(data[0]) && data[0].length > 0) {
                var groupElements = _.groupBy(data[0], function (elment) {
                    return elment.SystemID;
                });

                $.each(groupElements, function (index, group) {
                    var name = index;
                    var systems = _.where(config.AllSystems, { "SystemID": index });
                    if (systems && systems.length > 0) {
                        name = systems[0].SystemName;
                    }

                    var appList = new appStoreList.AppStoreLists();

                    _.each(group, function (v) {
                        if (v.DelFlag == 0) {
                            appList.add(new appStoreList.AppStoreList({
                                id: "A" + util.getNewId(),
                                appId: v.AppID,
                                appName: v.Name,
                                iconPath: v.IconPath,
                                appCommand: v.AppCommand,
                                param: v.param,
                                openType: v.OpenType,
                                systemId: v.SystemID,
                                appType: v.AppType,
                                appIconPath: v.AppIconPath,
                                //index: v.Index,
                                //isLastUse: v.IsLastUse,
                                //isCommonUse: v.IsCommonUse,
                                delFlag: v.DelFlag
                            }));
                        }
                    });

                    var systemGroup = new appStoreList.AppStoreGroup({
                        id: "G" + util.getNewId(),
                        systemId: index,
                        systemName: name,
                        appList: appList,
                        count: group.length
                    });

                    appStoreGroups.add(systemGroup);
                });
            }
        });

        //应用中心翻页逻辑
        PubSub.unsubscribe(config.AppStorePageEvent);
        PubSub.subscribe(config.AppStorePageEvent, function (message, data) {
            if (config.PageHelper.Type == "Search") {
                PubSub.publishSync(config.SearchAppsByKey, config.PageHelper);
                config.PageHelper.PageIndex++;
            } else if (config.PageHelper.Type == "ListField") {
                PubSub.publishSync(config.GetAppsByFieldId, config.PageHelper);
                config.PageHelper.PageIndex++;
            }
        });

        PubSub.unsubscribe(config.ResetCompositeAppEvent);
        PubSub.subscribe(config.ResetCompositeAppEvent, function (message, data) {
            appStoreLists.reset();
        });

        PubSub.publish(config.GetFields);
    };

    /*
    * 添加渲染应用
    * */
    CompositeAppService.addAndRenderSearchApp = function (data) {
        PubSub.publish(config.ComSearchAddAppEvent, data);
    };

    //初始化
    exports.init = function () {
        CompositeAppService.resgistCommand();
    };
});