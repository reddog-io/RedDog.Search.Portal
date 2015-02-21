using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using RedDog.Search.Portal.Models;
using RedDog.Search.Portal.Models.Mappers;

namespace RedDog.Search.Portal.Controllers
{
    [RoutePrefix("api/suggestions")]
    public class SuggestionsController : ApiController
    {
        private readonly IndexQueryClient _searchClient;

        public SuggestionsController(IndexQueryClient searchClient)
        {
            _searchClient = searchClient;
        }

        /// <summary>
        /// GET api/search.
        /// </summary>
        /// <returns>Search an index.</returns>
        [Route("{indexName}")]
        public async Task<HttpResponseMessage> Get(string indexName, [FromUri]ExtendedSuggestionQueryModel suggestionQuery)
        {            
            var result = await _searchClient.SuggestAsync(indexName, suggestionQuery.MapToSuggestionQuery());

            if (!result.IsSuccess)
                return Request.CreateResponse(result.StatusCode, result);

            return Request.CreateResponse(HttpStatusCode.OK, result);
        }
    }
}