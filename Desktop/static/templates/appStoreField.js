/*
 * Create by 盖玉龙 on 2014-10-14
 */
define(function(){
    var strVar  = "<li class=\"li_field\" id=\"<%=id%>\" data=\"<%=fieldId%>\">";
    strVar += "<h5><a href=\"javascript:void(0)\"><%=fieldName%>(<%=num%>)<\/a><span><\/span><\/h5><ul><\/ul>";
    strVar += "<\/li>";
    return strVar;
});