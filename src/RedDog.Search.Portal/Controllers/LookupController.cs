using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using RedDog.Search.Model;

namespace RedDog.Search.Portal.Controllers
{
    [RoutePrefix("api/lookup")]
    public class LookupController : ApiController
    {
        private readonly IndexQueryClient _searchClient;

        public LookupController(IndexQueryClient searchClient)
        {
            _searchClient = searchClient;
        }

        /// <summary>
        /// GET api/lookup.
        /// </summary>
        /// <returns>Lookup a document in the index.</returns>
        [Route("{indexName}")]
        public async Task<HttpResponseMessage> Get(string indexName, [FromUri]LookupQuery lookupQuery)
        {
            var result = await _searchClient.LookupAsync(indexName, lookupQuery);

            if (!result.IsSuccess)
                return Request.CreateResponse(result.StatusCode, result);

            return Request.CreateResponse(HttpStatusCode.OK, result);
        }
    }
}