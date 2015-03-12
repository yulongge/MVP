/*
* Create by 盖玉龙 on 2014-10-14
*/
define(function(){
    var strVar  = "<li class=\"li_system\" id=\"<%=id%>\" data=\"<%=systemId%>\">";
        strVar += "<a href=\"javascript:void(0)\"><%=systemName%>(<%=num%>)<\/a>" ;
        strVar += "<\/li>";
    return strVar; 
});