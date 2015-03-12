/*
* Create by 盖玉龙 on 2014-10-15
*/
define(function(){

    var strVar  = "<li data=\"<%=appId%>\">";
     	strVar += "<p><img src=\"<%= getAlternateParam(appIconPath, iconPath) %>\" alt=\"<%=appName%>\" title=\"<%=appName%>\" /><\/p>";
        strVar += "<h5><%=appName%><\/h5>";
        strVar += "<a href=\"javascript:void(0)\" class=\"add\">添加<\/a>";
        strVar += "<\/li>";
    return strVar; 
});