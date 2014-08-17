using System.Reflection;
using System.Web.Http;
using Autofac;
using Autofac.Integration.WebApi;
using Microsoft.Owin;
using Microsoft.WindowsAzure;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;
using Owin;
using RedDog.Search.Http;
using RedDog.Search.Portal;

[assembly: OwinStartup(typeof(Startup))]

namespace RedDog.Search.Portal
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            // Configure Autofac.
            var builder = new ContainerBuilder();
            builder.RegisterApiControllers(Assembly.GetExecutingAssembly());

            // Configure Search.
            builder.Register(ctx => ApiConnection.Create(CloudConfigurationManager.GetSetting("Azure.Search.ServiceName"),
                CloudConfigurationManager.GetSetting("Azure.Search.ApiKey")))
                .InstancePerRequest();
            builder.RegisterType<IndexManagementClient>()
                .InstancePerRequest();
            builder.RegisterType<IndexQueryClient>()
                .InstancePerRequest();

            // Create the container.
            var container = builder.Build();

            // Configure WebApi.
            var config = new HttpConfiguration();
            config.MapHttpAttributeRoutes();
            config.Routes.MapHttpRoute(
                    name: "DefaultApi",
                    routeTemplate: "api/{controller}/{id}",
                    defaults: new { id = RouteParameter.Optional }
            );
            config.DependencyResolver =
                new AutofacWebApiDependencyResolver(container);
            config.IncludeErrorDetailPolicy = IncludeErrorDetailPolicy.Always;
            config.Formatters.JsonFormatter.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
            config.Formatters.JsonFormatter.SerializerSettings.Converters.Add(new StringEnumConverter { CamelCaseText = true });

            // Owin.
            app.UseWebApi(config);
            app.UseAutofacMiddleware(container);
        }
    }
}
