namespace RedDog.Search.Portal.Models
{
    public class ExtendedSuggestionQueryModel
    {
        public string Search
        {
            get;
            set;
        }


        public bool Fuzzy
        {
            get;
            set;
        }

        public string SearchFields
        {
            get;
            set;
        }

        public long Top
        {
            get;
            set;
        }

        public string Filter
        {
            get;
            set;
        }

        public string OrderBy
        {
            get;
            set;
        }

        public string Select
        {
            get;
            set;
        }
    }
}