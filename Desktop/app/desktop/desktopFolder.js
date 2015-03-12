/**
 * Created by Administrator on 2014/11/17.
 */
define(function(require, exports, module) {

    seajs.log("初始化：" + module.id);

    var config = require("app/config");

    var flBase = require("app/desktop/desktopFlBase");
    var elBase = require("app/desktop/desktopElBase");

    /*
     * 最大化文件夹实体
     * */
    var DesktopFolderMax = flBase.DesktopFloat.extend({defaults:
        _.extend({},flBase.DesktopFloat.prototype.defaults,
            {
                appId:"",
                //文件夹类型
                folderType:config.FolderType_MAX,
                //文件夹布局
                folderLayout:config.FolderLayout_Grid,
                //文件夹
                folderApps:new elBase.DesktopElements()
            })
    });



    /*
     * 最小化文件夹实体
     * */
    var DesktopFolderMin = elBase.DesktopElement.extend({defaults:
        _.extend({},elBase.DesktopElement.prototype.defaults,
            {
                appId:"",
                //文件夹类型
                folderType:config.FolderType_MIN,
                //文件夹布局
                folderLayout:config.FolderLayout_Grid,
                //文件夹
                folderApps:new elBase.DesktopElements()
            })
    });


    module.exports = {
        DesktopFolderMin: DesktopFolderMin,
        DesktopFolderMax: DesktopFolderMax
    };

});