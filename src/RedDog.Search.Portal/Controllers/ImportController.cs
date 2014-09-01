using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using CsvHelper;
using Microsoft.WindowsAzure;
using RedDog.Search.Model;

namespace RedDog.Search.Portal.Controllers
{
    [RoutePrefix("api/import")]
    public class ImportController : ApiController
    {
        private readonly IndexManagementClient _managementClient;

        public ImportController(IndexManagementClient managementClient)
        {
            _managementClient = managementClient;
        }

        /// <summary>
        /// GET api/search.
        /// </summary>
        /// <returns>Search an index.</returns>
        [Route("{indexName}")]
        public async Task<HttpResponseMessage> Put(string indexName)
        {
            var request = Request;
            if (!request.Content.IsMimeMultipartContent())
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);

            // Get the current index.
            var index = await _managementClient.GetIndexAsync(indexName);
            if (!index.IsSuccess)
                return Request.CreateResponse(index.StatusCode, index);
            var keyField = index.Body.Fields.FirstOrDefault(f => f.Key);
            if (keyField == null)
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, "Unable to find key field.");

            // Read all files.
            var root = System.Web.HttpContext.Current.Server.MapPath("~/App_Data/imports");
            if (!Directory.Exists(root))
                Directory.CreateDirectory(root);

            var provider = new MultipartFormDataStreamProvider(root);
            await request.Content.ReadAsMultipartAsync(provider);

            // Operations.
            var operations = new List<IndexOperation>();

            // Process all files.
            foreach (var file in provider.FileData)
            {
                using (var streamReader = new StreamReader(file.LocalFileName))
                {
                    var parser = new CsvParser(streamReader);
                    parser.Configuration.Delimiter = CloudConfigurationManager.GetSetting("CsvDelimiter");
                    var header = parser.Read();
                    if (header == null)
                        return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, "The CSV file does not contain a header.");
                    var columns = header.ToList();
                    if (columns.IndexOf(keyField.Name) < 0)
                        return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, "The CSV file does not contain the key field.");
                    
                    // Process all records.
                    while (true)
                    {
                        var row = parser.Read();
                        if (row == null)
                            break;
                        
                        // Create a new operation.
                        var operation = new IndexOperation(IndexOperationType.Upload, keyField.Name, row[columns.IndexOf(keyField.Name)]);
                        for (int i = 0; i < row.Length; i++)
                        {
                            var columnName = columns[i];
                            if (columnName != keyField.Name)
                            {
                                var field = index.Body.Fields.FirstOrDefault(f => f.Name == columnName);
                                if (field == null)
                                    return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, "Unknown field: " + field.Name);

                                if (field.Type == FieldType.StringCollection)
                                {
                                    operation.Properties.Add(columnName, row[i].Contains("/") ? row[i].Split('/') : new[] {row[i]});
                                }
                                else if (field.Type == FieldType.Double)
                                {
                                    double doubleValue = 0;
                                    double.TryParse(row[i], out doubleValue);
                                    operation.Properties.Add(columnName, doubleValue);
                                }
                                else if (field.Type == FieldType.Integer)
                                {
                                    int intValue = 0;
                                    int.TryParse(row[i], out intValue);
                                    operation.Properties.Add(columnName, intValue);
                                }
                                else if (field.Type == FieldType.Boolean)
                                {
                                    bool booleanValue = false;
                                    bool.TryParse(row[i], out booleanValue);
                                    operation.Properties.Add(columnName, booleanValue);
                                }
                                else if (field.Type == FieldType.DateTimeOffset)
                                {
                                    DateTimeOffset dateValue = DateTimeOffset.MinValue;
                                    DateTimeOffset.TryParse(row[i], out dateValue);
                                    operation.Properties.Add(columnName, dateValue);
                                }
                                else if (field.Type == FieldType.GeographyPoint)
                                {
                                    if (row[i].Contains('|'))
                                    {
                                        var coordinates = row[i].Split('|');
                                        operation.Properties.Add(columnName, new { type = "Point", coordinates = new[]
                                        {
                                            double.Parse(coordinates[0], CultureInfo.InvariantCulture), // Latitude
                                            double.Parse(coordinates[1], CultureInfo.InvariantCulture)  // Longitude
                                        }});   
                                    }
                                }
                                else
                                {
                                    operation.Properties.Add(columnName, row[i]);
                                }
                            }
                        }

                        // Add operation to batch.
                        operations.Add(operation);
                    }
                }
            }

            // Populate.
            var result = await _managementClient.PopulateAsync(indexName, operations.ToArray());
            if (!result.IsSuccess)
                return Request.CreateResponse(result.StatusCode, result);
            return Request.CreateResponse(HttpStatusCode.OK, result);
        }
    }
}