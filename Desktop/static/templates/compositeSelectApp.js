/*
* Create by 盖玉龙 on 2014-10-14
*/
define(function(){
    var strVar ="<li data=\"<%=appId%>\">";
	    strVar +="    <p><img src=\"<%= getAlternateParam(appIconPath, iconPath) %>\" alt=\"<%=appName%>\" title=\"<%=appName%>\" \/><\/p>";
	    strVar +="    <h5><%=appName%><\/h5>";
	    //strVar +="    <span class=\"sign\"><\/span>";
	    strVar +="<\/li>";
    return strVar; 
});