/**
 * Created by Administrator on 2014/9/29.
 */

var DesktopVersion = "2.0.32";
DesktopVersion = new Date().getTime();

seajs.config({
    charset: 'utf-8',
    base: "../Desktop/",
    alias: {
        //基础模块
        "jquery": "base/jquery/jquery-module.js",
        "jquery-ui": "base/jquery-ui/jquery-ui-module.js",
        "backbone": "base/backbone/backbone-module.js",
        "underscore": "base/underscore/underscore-module.js",
        "underscore-templatehelpers": "base/underscore/underscore-templatehelpers-module.js",
        "pubsubjs": "base/pubsubjs/pubsub-module.js",
        "json2": "base/json/json2-module.js",

        //插件模块
        "highlightRegex": "plugin/highlightRegex/highlightRegex-module.js",
        "jquerySimulate": "plugin/jquerySimulate/jquery.simulate-module.js",


        //模板文件
        "desktop_tpl": "static/templates/desktop.js",
        "application_tpl": "static/templates/application.js",
        "folder_tpl": "static/templates/folder.js",
        "folderMin_tpl": "static/templates/folderMin.js",
        "folderPop_tpl": "static/templates/folderPop.js",
        "folderPopMenu_tpl": "static/templates/folderPopMenu.js",
        "desktopPopMenu_tpl": "static/templates/desktopPopMenu.js",
        "compositePopMenu_tpl": "static/templates/compositePopMenu.js",
        "applicationPopMenu_tpl": "static/templates/applicationPopMenu.js",
        "appStoreContainer_tpl": "static/templates/appStoreContainer.js",
        "appStoreContainerGuid_tpl": "static/templates/appStoreContainerGuid.js",
        "appStoreGuidStep1_tpl": "static/templates/appStoreGuidStep1.js",
        "appStoreGuidStep2_tpl": "static/templates/appStoreGuidStep2.js",
        "guid_tpl": "static/templates/guid.js",
        "appStoreSystem_tpl": "static/templates/appStoreSystem.js",
        "appStoreField_tpl": "static/templates/appStoreField.js",
        "appStoreType_tpl": "static/templates/appStoreType.js",
        "appStoreList_tpl": "static/templates/appStoreList.js",
        "appStoreGroup_tpl": "static/templates/appStoreSearchGroup.js",
        "composite_tpl": "static/templates/composite.js",
        "compositeApp_tpl": "static/templates/compositeApp.js",
        "compositeIcon_tpl": "static/templates/compositeIcon.js",
        "compositeAppAdd_tpl": "static/templates/compositeAppAdd.js",
        "compositeMenu_tpl": "static/templates/compositeMenu.js",
        "compositeSelectApp_tpl": "static/templates/compositeSelectApp.js",
        "compositeSelectedApp_tpl": "static/templates/compositeSelectedApp.js",
        "warnMessage_tpl": "static/templates/warnMessage.js",
        "widget_tpl": "static/templates/widget.js",
        "selectSystem_tpl": "static/templates/commonSystem.js",


        //MVP服务
        "mvpService": "app/service/mvpService.js",
        "desktopService": "app/service/desktopService.js",
        "appStoreService":"app/service/appStoreService.js",
        "compositeAppService":"app/service/compositeAppService.js"
    },
    map: [
        [ /^(.*\.(?:css|js))(.*)$/i, '$1?'+ DesktopVersion]
    ],
    debug: true
});

seajs.log("加载样式文件");
//样式文件
seajs.use("static/style/css/ui-lightness/jquery-ui-1.10.3.custom.css");
seajs.use("static/style/desktop.css");
seajs.use("static/style/desktopBig.css");
seajs.use("static/style/folder.css");
seajs.use("static/style/folderBig.css");
seajs.use("static/style/style.css");

seajs.log("加载入口模块");
//入口模块
seajs.use("app/init");
