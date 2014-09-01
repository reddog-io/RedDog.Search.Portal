using System;
using System.Net;
using System.Net.Http;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using Microsoft.WindowsAzure;

namespace RedDog.Search.Portal.Filters
{
    public class RequireConfigurationFilter : ActionFilterAttribute
    {
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            if (String.IsNullOrEmpty(CloudConfigurationManager.GetSetting("Azure.Search.ServiceName")) || String.IsNullOrEmpty(CloudConfigurationManager.GetSetting("Azure.Search.ApiKey")))
            {
                actionContext.Response = actionContext.Request.CreateResponse(HttpStatusCode.InternalServerError, new { isConfigurationError = true });
                return;
            }

            base.OnActionExecuting(actionContext);
        }
    }
}