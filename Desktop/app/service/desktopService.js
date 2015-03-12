/**
 * Created by Administrator on 2014/9/29.
 */
define(function (require, exports, module) {
    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var json2 = require("json2");

    var config = require("app/config");

    var container = require("app/desktop/desktopContainer");
    var layer = require("app/desktop/desktopLayer");

    var systemContainer = require("app/system/selectSystemContainer");


    //桌面元素
    var element = require("app/desktop/desktopElement");
    var composite = require("app/desktop/desktopComposite");
    var application  = require("app/desktop/desktopApplication");
    var folderMin = require("app/desktop/desktopFolderMin");

    //桌面浮动元素
    var float = require("app/desktop/desktopFloat");
    var folderMax = require("app/desktop/desktopFolderMax");

    var MvpService = require("mvpService");

    //桌面服务
    var DesktopService = {};

    /*
    * 加载所有系统
    * */
    DesktopService.loadAllSystems = function () {

        //获取所有业务域回调
        PubSub.subscribe(config.GetSystemsCallBack, function (message, data) {
            if ($.isArray(data) && data.length > 0) {
                config.AllSystems = data[0];
            }
            //alert(json2.stringify(config.AllSystems))
            seajs.log(config.AllSystems);

            //打开用户系统
            PubSub.publishSync(config.SelectSystem,false);
        });
        //获取所有业务域
        PubSub.subscribe(config.GetSystems, function (message, data) {
            MvpService.call(config.GetSystems, [data]);
        });

        PubSub.publishSync(config.GetSystems);
    };

    /*
    * 注册事件
    * */
    DesktopService.resgistCommand = function () {

        //创建新图层
        PubSub.unsubscribe(config.CreateNewLayerEvent);
        PubSub.subscribe(config.CreateNewLayerEvent, function (message, data) {
            DesktopService.createNewLayer(data[0],data[1]);
        });

        //移除图层，注销事件
        PubSub.unsubscribe(config.RemoveLayerCallBack);
        PubSub.subscribe(config.RemoveLayerCallBack, function (message, data) {
            PubSub.unsubscribe(data);
        });

        //获取用户配置回调
        PubSub.unsubscribe(config.LoadConfigCallBack);
        PubSub.subscribe(config.LoadConfigCallBack, function (message, data) {
            if (config.IsLoaded) return;

            if (typeof data == "object") {
                DesktopService.renderDesktop(data);
            }
            else {
                var dataJson = json2.parse(data);
                DesktopService.renderDesktop(dataJson);
            }

            config.IsLoaded = true;

            DesktopService.loadAllSystems();
        });

        //加载桌面配置信息
        PubSub.unsubscribe(config.LoadConfig);
        PubSub.subscribe(config.LoadConfig, function (message, data) {
            MvpService.call(config.LoadConfig, [config.WebDesk]);
        });
        //自定义桌面
        PubSub.unsubscribe(config.DefinedSkinCallBack);
        PubSub.subscribe(config.DefinedSkinCallBack,function(message,data){
            PubSub.publishSync(config.ChangeDesktopSkin,data);
        });

        PubSub.unsubscribe(config.DefinedSkin);
        PubSub.subscribe(config.DefinedSkin,function(message,data){
            PubSub.publishSync(config.HideDesktopPopThings);
            MvpService.call(config.DefinedSkin,data);
        });

        //添加本地应用程序

        PubSub.unsubscribe(config.AddClientAppCallBack);
        PubSub.subscribe(config.AddClientAppCallBack,function(message,data){
           // alert(json2.stringify(data));
            DesktopService.addClientAppToDesktop(data);
        });
        PubSub.unsubscribe(config.AddClientApp);
        PubSub.subscribe(config.AddClientApp,function(message,data){
            PubSub.publishSync(config.HideDesktopPopThings);
            MvpService.call(config.AddClientApp,data);
        });

        //添加收藏
        PubSub.unsubscribe(config.FavoriteAppCallBack);
        PubSub.subscribe(config.FavoriteAppCallBack,function(message,data){
            DesktopService.addFavoriteAppToDesktop(data[0]);
        });

        //获取用户登陆类型
        PubSub.unsubscribe(config.GetLoginType);
        PubSub.subscribe(config.GetLoginType,function(message,data){
            var callBack = data;
            var rValue = MvpService.call(config.AddClientApp,"GO");
            if(callBack)
                callBack(rValue);
        });

        //设置用户配置
        PubSub.unsubscribe(config.SetConfig);
        PubSub.subscribe(config.SetConfig, function (message, data) {
            MvpService.call(config.SetConfig, [config.WebDesk, json2.stringify(data)]);
        });

        //打开桌面应用
        PubSub.unsubscribe(config.OpenApp);
        PubSub.subscribe(config.OpenApp, function (message, data) {
            MvpService.call(config.OpenApp, [data]);
        });

        /*桌面向导*/
        PubSub.unsubscribe(config.GuidGetDataCallBack);
        PubSub.subscribe(config.GuidGetDataCallBack,function(message,data){
           // view.initGuid(data);
            PubSub.publishSync(config.InitGuid,data);
        });
        PubSub.unsubscribe(config.GuidGetData);
        PubSub.subscribe(config.GuidGetData,function(message,data){
             MvpService.call(config.GuidGetData,data);
        });
        PubSub.subscribe(config.GuidSender,function(message,data){
            MvpService.call(config.GuidSender,data);
        });
        //撤销登录应用
        PubSub.unsubscribe(config.LogoutApp);
        PubSub.subscribe(config.LogoutApp, function (message, data) {
            MvpService.call(config.LogoutApp, [data]);
        });

        //撤销登录应用
        PubSub.unsubscribe(config.SelectSystem);
        PubSub.subscribe(config.SelectSystem, function (message, data) {
            DesktopService.createCommonSystem(data);
        });



        //保存转换逻辑
        PubSub.unsubscribe(config.SaveAdapterEvent);
        PubSub.subscribe(config.SaveAdapterEvent, function (message, data) {
            var layers = data[0];
            var theme = data[1];
            var definedSkin = data[2];
            var WebScale = data[3];

            var result = {};

            result.ConfigVersion = DesktopVersion;
            result.StyleClass = theme;
            result.definedSkin = definedSkin;
            result.WebScale = WebScale;
            result.desktopCollection = [];
            result.IsConfigDefaultDesktop = config.IsConfigDefaultDesktop;
            //以后新增对象放入扩展项中
            //ExtendObject


            $.each(layers, function (i, layer) {
                var desktop = {};
                desktop.id = layer.id;
                desktop.index = 0;
                desktop.name = "桌面";
                desktop.controlCollection = [];
                $.each(layer.data, function (i, item) {
                    if (item.get("appType") == config.ElementType.Application) {
                        var application = {
                            "id": item.get("id"),
                            "Name": item.get("name"),
                            "AppID": item.get("appId"),
                            "SystemID": item.get("systemId"),
                            "LoginType": item.get("loginType"),
                            "AppType": config.ElementType.Application,
                            "IconPath": item.get("sysIconPath"),
                            "AppIconPath": item.get("appIconPath"),
                            "AppCommand": item.get("appCommand"),
                            "Index": item.get("index"),
                            "position": item.get("position"),
                            "param": item.get("param"),
                            "OpenType": item.get("openType"),
                            "lock":item.get("lock")
                        };
                        desktop.controlCollection.push(application);
                    }

                    if (item.get("appType") == config.ElementType.Folder) {
                        var folder = {
                            "id": item.get("id"),
                            "Name": item.get("name"),
                            "AppID": item.get("appId"),
                            "AppType": config.ElementType.Folder, //文件夹修正为5
                            "Index": item.get("index"),
                            "position": item.get("position"),
                            "folderType": item.get("folderType"),
                            "folderLayout": item.get("folderLayout"),
                            "param": [],
                            "AppTypeEnum": 32,
                            "OpenType": 0,
                            "lock":item.get("lock")
                        };

                        item.get("folderApps").each(function (app) {
                            folder.param.push({
                                "id": app.get("id"),
                                "Name": app.get("name"),
                                "AppID": app.get("appId"),
                                "SystemID": app.get("systemId"),
                                "IconPath": app.get("sysIconPath"),
                                "AppIconPath": app.get("appIconPath"),
                                "Index": app.get("index"),
                                "position": app.get("position"),
                                "param": app.get("param"),
                                "LoginType": app.get("loginType"),
                                "AppType": config.ElementType.Application,
                                "AppCommand": app.get("appCommand"),
                                "OpenType": app.get("openType"),
                                "background": "green",
                                "canResized": false,
                                "canModify": false,
                                "titleDrag": false,
                                "lock":app.get("lock")
                            });
                        });

                        desktop.controlCollection.push(folder);
                    }

                    if (item.get("appType") == config.ElementType.Composite) {
                        var composite = {
                            "id": item.get("id"),
                            "Name": item.get("name"),
                            "AppID": item.get("appId"),
                            "SystemID": "fhyy",
                            "AppType": config.ElementType.Composite,
                            "IconPath": item.get("appIconPath"),
                            "AppIconPath": item.get("appIconPath"),
                            "Index": item.get("index"),
                            "position": item.get("position"),
                            "param": [],
                            "OpenType": 0,
                            "AppCommand": "",
                            "canResized": false,
                            "canModify": false,
                            "titleDrag": false,
                            "lock":item.get("lock")
                        };

                        item.get("compositeApps").each(function (app) {
                            composite.param.push({
                                "id": app.get("id"),
                                "AppID": app.get("appId"),
                                "Name": app.get("name"),
                                "SystemID": app.get("systemId"),
                                "IconPath": app.get("sysIconPath"),
                                "AppIconPath": app.get("appIconPath"),
                                "LoginType": app.get("loginType"),
                                "AppType": config.ElementType.Application,
                                "Index": app.get("index"),
                                "position": app.get("position"),
                                "param": app.get("param"),
                                "AppCommand": app.get("appCommand"),
                                "OpenType": app.get("openType"),
                                "IsCommonUse": "false",
                                "IsLastUse": "false",
                                "lock":app.get("lock")
                            });
                        });

                        desktop.controlCollection.push(composite);
                    }
                });

                result.desktopCollection.push(desktop);
            });

            seajs.log(result);

            PubSub.publish(config.SetConfig, result);
        });

    };

    /*
    * 根据桌面配置JSON渲染桌面
    * */
    DesktopService.renderDesktop = function (data) {

        config.IsInitFinish = false;

        //创建桌面容器
        var desktopContainerView = new container.DesktopContainerView();
        var desktopContainer = new container.DesktopContainer();
        desktopContainerView.setModel(desktopContainer);

        var desktopLayers = new layer.DesktopLayers();
        var desktopLayersView = new layer.DesktopLayersView();
        desktopLayersView.setModel(desktopLayers);

        if ($.isArray(data) && data.length > 0) {

            //桌面背景设置
            var theme = data[0].StyleClass;
            var definedSkin = data[0].definedSkin;
            var WebScale = data[0].WebScale;
            config.ConfigVersion = data[0].ConfigVersion;
            //是否已配置
            config.IsConfigDefaultDesktop = data[0].IsConfigDefaultDesktop == undefined ? false:data[0].IsConfigDefaultDesktop;

            var themes = _.where(config.ThemeStyle, { "data": theme });
            if (themes.length == 0) {
                theme = _.first(config.ThemeStyle).data;
            }
            if(theme == "userDefined"){
                desktopContainer.set({ "theme": theme,"definedSkin":definedSkin});
            }else{
                desktopContainer.set({ "theme": theme });
            }
            if(WebScale == undefined){}else{
                desktopContainerView.changeSize(WebScale);
            }

            var desktopModels = data[0].desktopCollection;
            DesktopService.parseAllLayers(desktopLayers, desktopModels);
        } else {
            var themeStyle = _.first(config.ThemeStyle);
            desktopContainer.set({ "theme": themeStyle.data });

            var desktopId = "L" + util.getNewId();
            var desktopLayer = new layer.DesktopLayer({
                id: desktopId,
                isActive: true
            });
            DesktopService.createNewLayer(desktopLayers,desktopLayer);
        }

        config.IsInitFinish = true;
        PubSub.subscribe(config.ChangeDesktopSkin,function(message,data){

            desktopContainerView.definedBackground(data);
        })

    };

    /*
    * 解析桌面
    * */
    DesktopService.parseAllLayers = function (desktopLayers, desktopModels) {

        $.each(desktopModels, function (n, desktopModel) {

            var desktopId = "D" + util.getNewId(); //desktopModel.id;
            var desktopLayer = new layer.DesktopLayer({
                id: desktopId,
                isActive: n == 0
            });
            desktopLayers.add(desktopLayer);

            var elementModels = desktopModel.controlCollection;
            //渲染桌面应用
            DesktopService.renderDesktopElement(desktopLayer, elementModels);
            //渲染桌面文件夹
            DesktopService.renderDesktopFloat(desktopLayer, elementModels);
        });
        //DesktopService.defaultFolderCreate();
    };

    /*
    * 渲染应用
    * */
    DesktopService.renderDesktopElement = function (desktopLayer, elementModels) {

        var desktopId = desktopLayer.get("id");
        var componentElements = new element.DesktopElements();
        var componentElementsView = new element.DesktopElementsView({ el: "div#" + desktopId });
        componentElementsView.setModel(desktopLayer, componentElements);

        $.each(elementModels.sort(function(x,y){return x.Index-y.Index}), function (m, elementModel) {
            //应用条件
            if (elementModel.AppType == config.ElementType.Application
                && $.isArray(elementModel.param) == false) {

                //修正旧版本尺寸问题
                if(config.ConfigVersion == undefined){
                    elementModel.position = MvpService.fixSize(elementModel.position);
                }

                componentElements.add(new application.DesktopApplication({
                    id: "A" + util.getNewId(),
                    name: elementModel.Name,
                    appId: elementModel.AppID,
                    sysIconPath: elementModel.IconPath,
                    appIconPath: elementModel.AppIconPath,
                    appCommand: elementModel.AppCommand,
                    loginType: elementModel.LoginType, //登录类型
                    param: elementModel.param,
                    //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                    appType: config.ElementType.Application,
                    //0:BS 1:CS 2:独立，3内部启动
                    openType: elementModel.OpenType,
                    systemId: elementModel.SystemID,
                    index: elementModel.Index,
                    position: {
                        width: util.postion.Param.Element.Width,
                        height: util.postion.Param.Element.Height,
                        top: elementModel.position.top,
                        left: elementModel.position.left
                    },
                    lock:elementModel.lock
                }));
            }

            //复合应用兼容性逻辑
            if(elementModel.AppType == config.ElementType.Application
                && $.isArray(elementModel.param) == true
                && elementModel.AppTypeEnum == undefined){
                elementModel.AppType = config.ElementType.Composite;
            }

            //复合应用条件
            if (elementModel.AppType == config.ElementType.Composite
                    && $.isArray(elementModel.param) == true){

                //修正旧版本尺寸问题
                if(config.ConfigVersion == undefined){
                    elementModel.position = MvpService.fixSize(elementModel.position);
                }

                var compositeElments = new element.DesktopElements();
                componentElements.add(new composite.DesktopComposite({
                    id: "C" + util.getNewId(),
                    name: elementModel.Name,
                    appId: elementModel.AppID,
                    appIconPath: elementModel.AppIconPath,
                    //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                    appType: config.ElementType.Composite,
                    //0:BS 1:CS 2:独立，3内部启动
                    openType: elementModel.OpenType,
                    systemId: elementModel.SystemID,
                    index: elementModel.Index,
                    position: {
                        width: util.postion.Param.Element.Width,
                        height: util.postion.Param.Element.Height,
                        top: elementModel.position.top,
                        left: elementModel.position.left
                    },
                    compositeApps: compositeElments,
                    lock:elementModel.lock
                }));

                $.each(elementModel.param, function (n, app) {
                    compositeElments.add(new application.DesktopApplication({
                        id: "C" + util.getNewId(),
                        name: app.Name,
                        appId: app.AppID,
                        sysIconPath: app.IconPath,
                        appIconPath: app.AppIconPath,
                        appCommand: app.AppCommand,
                        loginType: app.LoginType, //登录类型
                        param: app.param,
                        //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                        appType: app.AppType,
                        //0:BS 1:CS 2:独立，3内部启动
                        openType: app.OpenType,
                        systemId: app.SystemID,
                        lock:app.lock
                    }));
                });
            }

            //文件夹条件,最小化的文件夹作为桌面元素渲染
            if (
                (elementModel.AppType == config.ElementType.Folder
                    && $.isArray(elementModel.param) == true
                    && elementModel.folderType == config.FolderType_MIN)
                ) {

                //修正旧版本尺寸问题
                if(config.ConfigVersion == undefined){
                    elementModel.position = MvpService.fixSize(elementModel.position);
                }

                var folderElments = new element.DesktopElements();
                var folderModel = new folderMin.DesktopFolderMin({
                    id:  "F" +util.getNewId() ,
                    name: elementModel.Name,
                    appId: elementModel.AppID,
                    //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                    appType: config.ElementType.Folder,
                    //0:BS 1:CS 2:独立，3内部启动
                    index: elementModel.Index,
                    position: {
                        width: util.postion.Param.Element.Width,
                        height: util.postion.Param.Element.Height,
                        top: elementModel.position.top,
                        left: elementModel.position.left
                    },
                    folderType: elementModel.folderType != undefined ? elementModel.folderType : config.FolderType_MAX,
                    folderLayout: elementModel.folderLayout != undefined ? elementModel.folderLayout : config.FolderLayout_Grid,
                    folderApps: folderElments,
                    lock:elementModel.lock
                });

                componentElements.add(folderModel);

                $.each(elementModel.param, function (n, app) {
                    folderElments.add(new application.DesktopApplication({
                        id: "FA" + util.getNewId(),
                        name: app.Name,
                        appId: app.AppID,
                        sysIconPath: app.IconPath,
                        appIconPath: app.AppIconPath,
                        appCommand: app.AppCommand,
                        loginType: app.LoginType, //登录类型
                        param: app.param,
                        //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                        appType: app.AppType,
                        //0:BS 1:CS 2:独立，3内部启动
                        openType: app.OpenType,
                        systemId: app.SystemID,
                        lock:app.lock
                    }));
                });
            }

        });
    };

    /*
    * 渲染文件夹
    * */
    DesktopService.renderDesktopFloat = function (desktopLayer, elementModels) {
        var desktopId = desktopLayer.get("id");
        var componenFloats = new float.DesktopFloats();
        var componentFloatsView = new float.DesktopFloatsView({ el: "div#" + desktopId });
        componentFloatsView.setModel(desktopLayer, componenFloats);
       /* //是否有业务系统文件夹
        var isHaveBusinessSystem = false;
        var isHaveBusinessApp = false;
        //是否有业务应用文件夹*/


        $.each(elementModels, function (m, elementModel) {
            //文件夹条件，目前AppType设置有问题，兼容旧版本
            if(elementModel.folderType == undefined)
                elementModel.folderType = config.FolderType_MAX;
            if(elementModel.AppType == config.ElementType.Application
                && $.isArray(elementModel.param) == true
                && elementModel.AppTypeEnum == 32){
                elementModel.AppType = config.ElementType.Folder;
            }
            /*
            if(elementModel.Name == "业务系统"){
                config.isHaveBusinessSystem = true;
            }
            if(elementModel.Name == "业务应用"){
                config.isHaveBusinessApp = true;
            }*/

            //文件夹条件
            if (elementModel.AppType == config.ElementType.Folder
                    && $.isArray(elementModel.param) == true
                    && elementModel.folderType == config.FolderType_MAX) {

                //修正旧版本尺寸问题
                if(config.ConfigVersion == undefined){
                    elementModel.position = MvpService.fixSize(elementModel.position);
                }

                var folderElments = new element.DesktopElements();
                var folderModel = new folderMax.DesktopFolderMax({
                    id: "F" + util.getNewId(),
                    name: elementModel.Name,
                    appId: elementModel.AppID,
                    //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                    appType: config.ElementType.Folder,
                    //0:BS 1:CS 2:独立，3内部启动
                    position: {
                        width: elementModel.position.width,
                        height: elementModel.position.height,
                        top: elementModel.position.top,
                        left: elementModel.position.left
                    },
                    folderType: elementModel.folderType != undefined ? elementModel.folderType : config.FolderType_MAX,
                    folderLayout: elementModel.folderLayout != undefined ? elementModel.folderLayout : config.FolderLayout_Grid,
                    folderApps: folderElments,
                    lock:elementModel.lock
                });

                componenFloats.add(folderModel);

                $.each(elementModel.param, function (n, app) {
                    folderElments.add(new application.DesktopApplication({
                        id: "FA" + util.getNewId(),
                        name: app.Name,
                        appId: app.AppID,
                        sysIconPath: app.IconPath,
                        appIconPath: app.AppIconPath,
                        appCommand: app.AppCommand,
                        loginType: app.LoginType, //登录类型
                        param: app.param,
                        //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
                        appType: app.AppType,
                        //0:BS 1:CS 2:独立，3内部启动
                        openType: app.OpenType,
                        systemId: app.SystemID,
                        lock:app.lock
                    }));
                });
            }
        });
    };

    /*
    * 创建默认文件夹
    * */

    DesktopService.defaultFolderCreate = function(){
        if(!config.isHaveBusinessSystem){
            var folderElments = new element.DesktopElements();
            var position = {
                top: 60,
                left:250,
                width: 750,//util.postion.Param.Folder.Width,
                height:200// util.postion.Param.Folder.Height
            };
            var activeLayerid = util.getActiveLayerId();
            var folder = new folderMax.DesktopFolderMax();
            var folderId = "F" + util.getNewId();
            folder.set({
                id: folderId,
                appId: folderId,
                name: "业务系统",
                appType:5,
                position:position,
                folderType:config.FolderType_MAX,
                folderLayout:config.FolderLayout_Grid,
                folderApps:folderElments
            });
            //创建文件夹
            PubSub.publishSync([activeLayerid,config.CreateDesktopFloatEvent].join("."),folder);
            config.isHaveBusinessSystem = true;

            $("#"+activeLayerid).find(".desktop_layer_row .layer_app").each(function(i,v){
                var app = $(v).data("data");
                //调用桌面的移除事件
                PubSub.publishSync([activeLayerid,config.RemoveDesktopElementEvent].join("."),app);
                //添加应用到文件夹
                folderElments.add(app);
            });
        }

        if(!config.isHaveBusinessApp){
            var position = {
                top: 280,
                left:250,
                width: 750,//util.postion.Param.Folder.Width,
                height:200// util.postion.Param.Folder.Height
            };
            var activeLayerid = util.getActiveLayerId();
            var folder = new folderMax.DesktopFolderMax();
            var folderId = "F" + util.getNewId();
            folder.set({
                id: folderId,
                appId: folderId,
                name: "业务应用",
                appType:5,
                position:position,
                folderType:config.FolderType_MAX,
                folderLayout:config.FolderLayout_Grid,
                folderApps:new element.DesktopElements()
            });
            //创建文件夹
            PubSub.publishSync([activeLayerid,config.CreateDesktopFloatEvent].join("."),folder);
            config.isHaveBusinessApp = true;
        }

    };

    /*
    * 创建新桌面
    * */
    DesktopService.createNewLayer = function (desktopLayers,desktopLayer) {
        var desktopId = desktopLayer.get("id");
        desktopLayers.add(desktopLayer);

        //创建桌面视图支持
        var componentElements = new element.DesktopElements();
        var componentElementsView = new element.DesktopElementsView({ el: "div#" + desktopId });
        componentElementsView.setModel(desktopLayer, componentElements);

        //创建浮动视图支持
        var componenFloats = new float.DesktopFloats();
        var componentFloatsView = new float.DesktopFloatsView({ el: "div#" + desktopId });
        componentFloatsView.setModel(desktopLayer, componenFloats);
    };

    DesktopService.addClientAppToDesktop = function(data){
        var fileData = data[0][0];
        var layerBtns = $("#"+util.getActiveLayerId()).find(".layer_app");
        if(config.eidtClientApp!=null){
           var editData = config.eidtClientApp.data("data");
            editData.set("name",fileData.Name);
            editData.set("appIconPath",fileData.AppIconPath);
            editData.set("param",fileData.param);
            editData.set("appCommand",fileData.AppCommand);
            config.eidtClientApp.find("img").attr("src",fileData.AppIconPath);
            config.eidtClientApp.find("h4").text(fileData.Name);
            config.eidtClientApp = null;
            return;
        }else{
            layerBtns.each(function(i,v){
                var data  = $(v).data("data");
                if(data.get("appCommand")==fileData.AppCommand&&data.get("param")==fileData.param&&data.get("name")==fileData.Name&&data.get("appIconPath")==fileData.AppIconPath){
                    PubSub.publishSync([util.getActiveLayerId(),config.RemoveDesktopElementEvent].join("."),data);
                }
            });
        }
        var appElement = new application.DesktopApplication({
            id: "A" + util.getNewId(), //appElementFromStore.get("id"),
            name: fileData.Name,
            appId: fileData.AppID,
            appIconPath: fileData.AppIconPath,
            appCommand:fileData.AppCommand,
            param: fileData.param,
            //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
            appType: fileData.AppType,
            //0:BS 1:CS 2:独立，3内部启动
            openType: fileData.OpenType,
            systemId: fileData.SystemID,
            sysIconPath:fileData.IconPath,
            position: {
                width: util.postion.Param.Element.Width,
                height: util.postion.Param.Element.Height
            }
        });

        //config.addClientAppData = data;

        PubSub.publishSync([util.getActiveLayerId(),config.CreateDesktopElementEvent].join("."), appElement);
    };

    /*
     * 收藏应用到桌面
     * */
    DesktopService.addFavoriteAppToDesktop = function(data){
        var fileData = data;
        var appElementId =  "A" + util.getNewId();
        var appElement = new application.DesktopApplication({
            id:appElementId, //appElementFromStore.get("id"),
            name: fileData.Name,
            appId: fileData.AppID,
            appIconPath: fileData.IconPath,
            appCommand:fileData.AppCommand,
            param: fileData.param,
            //应用 = 0,小组件 = 1,指标 = 2,内部使用 =3,指标容器=4，文件夹=5，复合应用=6
            appType: config.ElementType.Application,
            //0:BS 1:CS 2:独立，3内部启动
            openType: fileData.OpenType,
            systemId: fileData.SystemID,
            position: {
                width: util.postion.Param.Element.Width,
                height: util.postion.Param.Element.Height
            }
        });

        var activeLayerid = util.getActiveLayerId();

        var systemFavoriteId = config.FavoriteFolderAppId;
        var systemFavoriteName = "系统收藏夹";

        if(fileData.SystemID != ""){
            var systems = _.where(config.AllSystems,{"SystemID":fileData.SystemID});
            if(systems && systems.length > 0){
                systemFavoriteId = config.FavoriteFolderAppId + "_" + fileData.SystemID;
                systemFavoriteName = systems[0].SystemName + "收藏";
            }
        }

        //添加收藏夹，按应用系统创建
        var findFolderId = util.findElementIdByAppId(systemFavoriteId);
        //不存在
        if(findFolderId == config.NoFoundIdent) {
            var folderElments = new element.DesktopElements();
            var width = 350;
            var height = 200;
            var position = {
                top:  util.postion.Param.Screen.HeightPadding,
                left: util.postion.Param.Screen.Width  - util.postion.Param.Screen.WidthPadding - width,
                width: width,
                height: height
            };
            var folder = new folderMax.DesktopFolderMax();
            findFolderId = "F" + util.getNewId();
            folder.set({
                id: findFolderId,
                appId: systemFavoriteId,
                name: systemFavoriteName,
                appType: config.ElementType.Folder,
                position: position,
                folderType: config.FolderType_MAX,
                folderLayout: config.FolderLayout_Grid,
                folderApps: folderElments
            });
            //创建文件夹
            PubSub.publishSync([activeLayerid, config.CreateDesktopFloatEvent].join("."), folder);
        }

        var $folder = $("#" + findFolderId);
        var folderData =$folder.data("data");
        var folderType = folderData.get("folderType");
        if(folderType == config.FolderType_MIN){
            folderData.set({"folderType":config.FolderType_MAX})
        }

        PubSub.publishSync([activeLayerid, config.TidyDesktopEvent].join("."));

        //添加应用
        var findElementId = util.findElementIdByAppId(fileData.AppID);
        //不存在
        if(findElementId == config.NoFoundIdent){
            var forlderInLayerId = util.getAppInWhichLayer(systemFavoriteId);
            PubSub.publishSync([forlderInLayerId ,findFolderId,config.AddFolderAppEvent].join("."),appElement);
            if(forlderInLayerId != activeLayerid)
                util.setActiveLayer(forlderInLayerId);
        }
        else{
            appElementId = findElementId;
            var appInLayerId = util.getAppInWhichLayer(fileData.AppID);
            if(appInLayerId != activeLayerid)
                util.setActiveLayer(appInLayerId);

            var dataConfirm = {};
            dataConfirm.title = "温馨提醒";
            dataConfirm.msg = "此应用已添加，不能重复添加相同地址的应用！";
            dataConfirm.confirm = function(){
                util.shineElement(appElementId);
            };
            dataConfirm.cancel = function(){
                util.shineElement(appElementId);
            };
            PubSub.publishSync(config.ShowWarnMessageEvent,dataConfirm);
        }

        //闪耀一下
        util.shineElement(appElementId)
    };

    /*
     * 打开系统选择
     * */
    DesktopService.createCommonSystem = function(flag){
        if(flag){
            var selectSystemEdit = new systemContainer.SelectSystemContainer();
            selectSystemEdit.render();
        }
        else{
            var userLoginType = MvpService.get(config.GetLoginType);
            if(userLoginType== config.UserLoginType_MVP && $.parseJSON(config.IsConfigDefaultDesktop) == false){
                var selectSystem = new systemContainer.SelectSystemContainer();
                selectSystem.render();
            }
        }
    };
    exports.init = function () {
        //注册事件
        DesktopService.resgistCommand();
        //获取桌面
        PubSub.publish(config.LoadConfig);
    };
});