RedDog.Search.Portal
====================

Sample management portal for Microsoft Azure Search which allows you to manage your indexes, import data and execute queries. Built with RedDog.Search, Autofac, AngularJS, ASP.NET Web API.

The RedDog Search Portal is also available as a [Site Extension](http://fabriccontroller.net/blog/posts/new-site-extension-available-for-azure-web-sites-search-portal-for-azure-search/) for Azure Web SItes

## Getting Started

### Configuring the portal:

Before you can use the portal you'll need to update the Web.config with the credentials of your Search Service:

```XML
  <appSettings>
    <add key="Azure.Search.ServiceName" value="myservice" />
    <add key="Azure.Search.ApiKey" value="mykey" />
  </appSettings>
```

### CSV import:

One of the features that can help you get started with Microsoft Azure Search is the CSV import functionality. This allows you to upload up to 1000 records in bulk. Note that the import is append only, which means that records will not be deleted from the index if they're not present in the CSV file.

The first thing you'll want to do is configure the CSV delimiter in the web.config. The default delimiter is ';'.

```XML
  <appSettings>
    <add key="CsvDelimiter" value=";" />
  </appSettings>
```

After that you can just open the index in the portal and choose 'Import'. When you upload the CSV file make sure it has a header where each column matches a field in the index. For coordinates, you'll need to put both the latitude and longitude in the same column, formatted like this: '{lat}-{lon}'. If you want to get started with a sample file, take a look at the 'samples' folder of this repository.
