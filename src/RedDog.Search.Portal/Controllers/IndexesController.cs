using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using RedDog.Search.Http;
using RedDog.Search.Model;

namespace RedDog.Search.Portal.Controllers
{
    [RoutePrefix("api/indexes")]
    public class IndexesController : ApiController
    {
        private readonly IndexManagementClient _managementClient;

        public IndexesController(IndexManagementClient managementClient)
        {
            _managementClient = managementClient;
        }

        /// <summary>
        /// GET api/indexes.
        /// </summary>
        /// <returns>The list of indexes.</returns>
        public async Task<IApiResponse<IEnumerable<Index>>> Get()
        {
            var result = await _managementClient.GetIndexesAsync();
            if (!result.IsSuccess)
            {
                ActionContext.Response.StatusCode = result.StatusCode;
            }
            return result;
        }

        /// <summary>
        /// GET api/indexes/indexName/stats.
        /// </summary>
        /// <returns>The statistics for an index.</returns>
        [Route("{indexName}/stats")]
        public async Task<IApiResponse<IndexStatistics>> GetStatistics(string indexName)
        {
            var result = await _managementClient.GetIndexStatisticsAsync(indexName);
            if (!result.IsSuccess)
            {
                ActionContext.Response.StatusCode = result.StatusCode;
            }
            return result;
        }

        /// <summary>
        /// GET api/indexes/indexName
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public async Task<IApiResponse<Index>> Get(string id)
        {
            var result = await _managementClient.GetIndexAsync(id);
            if (!result.IsSuccess)
            {
                ActionContext.Response.StatusCode = result.StatusCode;
            }
            return result;
        }

        /// <summary>
        /// POST api/indexes
        /// </summary>
        /// <param name="index"></param>
        /// <returns></returns>
        public async Task<HttpResponseMessage> Post(Index index)
        {
            var result = await _managementClient.CreateIndexAsync(index);
            if (!result.IsSuccess)
            {
                return Request.CreateResponse(result.StatusCode, result);
            }

            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        /// <summary>
        /// PUT api/indexes
        /// </summary>
        /// <param name="index"></param>
        /// <returns></returns>
        public async Task<HttpResponseMessage> Put(Index index)
        {
            var result = await _managementClient.UpdateIndexAsync(index);
            if (!result.IsSuccess)
            {
                return Request.CreateResponse(result.StatusCode, result);
            }

            return Request.CreateResponse(HttpStatusCode.OK, result);
        }

        /// <summary>
        /// DELETE api/indexes/id
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public async Task<HttpResponseMessage> Delete(string id)
        {
            var result = await _managementClient.DeleteIndexAsync(id);
            if (!result.IsSuccess)
            {
                return Request.CreateResponse(result.StatusCode, result);
            }

            return Request.CreateResponse(HttpStatusCode.OK, result);
        }
    }
}
