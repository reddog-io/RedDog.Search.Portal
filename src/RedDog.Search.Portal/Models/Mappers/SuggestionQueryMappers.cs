using RedDog.Search.Model;
using RedDog.Search.Portal.Controllers;

namespace RedDog.Search.Portal.Models.Mappers
{
    public static class SuggestionQueryMappers
    {
        public static SuggestionQuery MapToSuggestionQuery(this ExtendedSuggestionQueryModel extendedSuggestionQuery)
        {
            return new SuggestionQuery(extendedSuggestionQuery.Search)
                   {
                       Filter = extendedSuggestionQuery.Filter,
                       Fuzzy = extendedSuggestionQuery.Fuzzy,
                       OrderBy = extendedSuggestionQuery.OrderBy,
                       SearchFields = extendedSuggestionQuery.SearchFields,
                       Select = extendedSuggestionQuery.Select,
                       Top = extendedSuggestionQuery.Top,
                       SuggesterName = extendedSuggestionQuery.SuggesterName
                   };
        }
    }
}